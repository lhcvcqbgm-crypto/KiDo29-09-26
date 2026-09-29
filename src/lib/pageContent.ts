import { collection, doc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { auth, db } from './firebase';
import { isTrustedAdmin } from './adminAccess';

export type VocabTheme = 'green' | 'orange' | 'purple' | 'yellow' | 'white' | 'pink' | 'blue' | 'red' | 'cyan';

export interface ManagedVocabularyItem {
  id: string;
  word: string;
  label: string;
  phonetic: string;
  meaningVi: string;
  example?: string;
  grade: 1 | 2 | 3 | 4 | 5;
  icon: string;
  imageDriveId?: string;
  audioDriveId?: string;
  audioEnUrl?: string; // Phát âm tiếng Anh
  audioViUrl?: string; // Phát âm / đọc nghĩa tiếng Việt
  audioExampleEnUrl?: string; // Phát âm câu ví dụ tiếng Anh
  audioExampleViUrl?: string; // Phát âm câu ví dụ tiếng Việt
  colorTheme?: VocabTheme;
  enabled: boolean;
  order: number;
}

const driveIdPattern = /^[A-Za-z0-9_-]{10,128}$/;

function validVocabularyItem(raw: unknown): raw is ManagedVocabularyItem {
  if (!raw || typeof raw !== 'object') return false;
  const item = raw as ManagedVocabularyItem;
  return typeof item.id === 'string' && item.id.length <= 80 &&
    typeof item.word === 'string' && item.word.trim().length > 0 && item.word.length <= 80 &&
    typeof item.label === 'string' && item.label.length <= 80 &&
    typeof item.phonetic === 'string' && item.phonetic.length <= 100 &&
    typeof item.meaningVi === 'string' && item.meaningVi.trim().length > 0 && item.meaningVi.length <= 200 &&
    [1, 2, 3, 4, 5].includes(item.grade) && typeof item.icon === 'string' && item.icon.length <= 16 &&
    (!item.imageDriveId || driveIdPattern.test(item.imageDriveId)) &&
    (!item.audioDriveId || driveIdPattern.test(item.audioDriveId)) &&
    (!item.audioEnUrl || (typeof item.audioEnUrl === 'string' && item.audioEnUrl.length <= 500)) &&
    (!item.audioViUrl || (typeof item.audioViUrl === 'string' && item.audioViUrl.length <= 500)) &&
    (!item.audioExampleEnUrl || (typeof item.audioExampleEnUrl === 'string' && item.audioExampleEnUrl.length <= 500)) &&
    (!item.audioExampleViUrl || (typeof item.audioExampleViUrl === 'string' && item.audioExampleViUrl.length <= 500)) &&
    typeof item.enabled === 'boolean' && Number.isFinite(item.order);
}

export function subscribeVocabularyContent(onChange: (items: ManagedVocabularyItem[]) => void): () => void {
  return onSnapshot(collection(db, 'vocabularyContent'), (snapshot) => {
    const items = snapshot.docs.flatMap(entry => Array.isArray(entry.data().items) ? entry.data().items : []);
    onChange(items.filter(validVocabularyItem).sort((a, b) => a.order - b.order).slice(0, 1500));
  }, () => onChange([]));
}

export async function saveVocabularyContent(items: ManagedVocabularyItem[]): Promise<void> {
  if (!(await isTrustedAdmin(auth.currentUser))) throw new Error('Chỉ Admin đã xác minh mới được sửa từ vựng.');
  if (items.length > 1500 || !items.every(validVocabularyItem)) throw new Error('Danh sách từ vựng không hợp lệ hoặc vượt quá 1.500 từ.');
  const batch = writeBatch(db);
  for (const grade of [1, 2, 3, 4, 5]) {
    batch.set(doc(db, 'vocabularyContent', `grade-${grade}`), { items: items.filter(item => item.grade === grade), updatedAt: serverTimestamp() });
  }
  await batch.commit();
}

export function normalizeVocabularyKey(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
