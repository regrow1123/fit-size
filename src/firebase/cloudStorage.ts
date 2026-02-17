/**
 * Firestore 기반 클라우드 저장소
 * 구조: users/{uid}/data/wardrobe
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import type { User } from 'firebase/auth';
import { loadWardrobe, loadWardrobeData, type WardrobeData, type SavedGarment, type SavedBodyProfile } from '../utils/storage';

/** Firestore에 현재 인메모리 데이터 저장 */
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

/** Firestore에서 데이터 로드 → 인메모리 스토어에 반영 */
export async function loadFromCloud(user: User): Promise<WardrobeData | null> {
  if (!isFirebaseConfigured || !db) return null;
  const ref = doc(db, 'users', user.uid, 'data', 'wardrobe');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const d = snap.data();
  const data: WardrobeData = {
    version: 1,
    garments: (d.garments ?? []) as SavedGarment[],
    profile: (d.profile ?? null) as SavedBodyProfile | null,
  };
  // 인메모리 스토어에 반영
  loadWardrobeData(data);
  return data;
}
