/**
 * Firestore 기반 클라우드 저장소
 *
 * 구조: users/{uid}/data/wardrobe
 * localStorage와 동일한 형식으로 저장/로드
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import type { User } from 'firebase/auth';
import { loadWardrobe, type WardrobeData, type SavedGarment, type SavedBodyProfile } from '../utils/storage';

/** Firestore에 옷장 데이터 저장 */
export async function saveToCloud(user: User): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const data = loadWardrobe();
  const ref = doc(db, 'users', user.uid, 'data', 'wardrobe');
  await setDoc(ref, {
    garments: data.garments,
    profile: data.profile ?? null,
    updatedAt: serverTimestamp(),
  });
}

/** Firestore에서 옷장 데이터 로드 */
export async function loadFromCloud(user: User): Promise<WardrobeData | null> {
  if (!isFirebaseConfigured || !db) return null;
  const ref = doc(db, 'users', user.uid, 'data', 'wardrobe');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    version: 1,
    garments: (d.garments ?? []) as SavedGarment[],
    profile: (d.profile ?? null) as SavedBodyProfile | null,
  };
}

/** localStorage → Firestore 마이그레이션 (최초 로그인 시) */
export async function migrateLocalToCloud(user: User): Promise<boolean> {
  if (!isFirebaseConfigured) return false;

  // 클라우드에 이미 데이터가 있으면 스킵
  const cloudData = await loadFromCloud(user);
  if (cloudData && cloudData.garments.length > 0) return false;

  // 로컬 데이터가 있으면 클라우드로 업로드
  const localData = loadWardrobe();
  if (localData.garments.length > 0 || localData.profile) {
    await saveToCloud(user);
    return true;
  }
  return false;
}

/** Firestore 데이터를 localStorage에 동기화 */
export function syncToLocal(data: WardrobeData): void {
  const stored: WardrobeData = {
    version: 1,
    garments: data.garments,
    profile: data.profile,
  };
  localStorage.setItem('fitsize-wardrobe', JSON.stringify(stored));
}
