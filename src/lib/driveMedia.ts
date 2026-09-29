import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { ActiveTab } from '../types';
import { isTrustedAdmin } from './adminAccess';

export const MEDIA_FOLDER_ID = '1vkhCCJAq590YNQuPGkF5qBMwYURa3U0_';
export const MEDIA_FOLDER_URL = `https://drive.google.com/drive/folders/${MEDIA_FOLDER_ID}`;

export type MediaKind = 'text' | 'image' | 'audio' | 'video' | 'file';
export type MediaPosition = 'top' | 'bottom';
export type MediaDisplay = 'card' | 'banner' | 'popup';
export interface PageMediaItem {
  id: string;
  driveId: string;
  title: string;
  kind: MediaKind;
  position: MediaPosition;
  display?: MediaDisplay;
  description?: string;
  actionUrl?: string;
  icon?: string;
}

export const MEDIA_PAGES: Array<{ id: ActiveTab; label: string }> = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'grade-1', label: 'Lớp 1' }, { id: 'grade-2', label: 'Lớp 2' },
  { id: 'grade-3', label: 'Lớp 3' }, { id: 'grade-4', label: 'Lớp 4' },
  { id: 'grade-5', label: 'Lớp 5' }, { id: 'roadmap', label: 'Lộ trình' },
  { id: 'listening-speaking-img', label: 'Nghe nói qua ảnh' },
  { id: 'reading-writing-img', label: 'Đọc viết qua ảnh' },
  { id: 'speaking-topic-ai', label: 'Nói theo chủ đề' },
  { id: 'writing-topic-ai', label: 'Viết theo chủ đề' },
  { id: 'practice-ex', label: 'Bài tập' }, { id: 'sample-exams', label: 'Đề thi mẫu' },
  { id: 'reports', label: 'Báo cáo' }, { id: 'vocab', label: 'Từ vựng' },
  { id: 'flashcards', label: 'Flashcard' }, { id: 'quiz', label: 'Đố vui' },
  { id: 'listening', label: 'Luyện nghe' }, { id: 'speaking', label: 'Luyện nói' },
  { id: 'story', label: 'Truyện' }, { id: 'reading', label: 'Luyện đọc' },
  { id: 'daily-quotes', label: 'Câu mỗi ngày' }, { id: 'grammar-tenses', label: 'Ngữ pháp' },
  { id: 'mind-thinking', label: 'Tư duy' }, { id: 'shadowing', label: 'Shadowing' },
  { id: 'storyboard-shadowing', label: 'Storyboard' }, { id: 'dictation', label: 'Chính tả' },
  { id: 'task-station', label: 'Nhiệm vụ' }, { id: 'video-lectures', label: 'Video' },
  { id: 'games', label: 'Trò chơi' }, { id: 'rewards', label: 'Phần thưởng' },
  { id: 'parent-corner', label: 'Góc phụ huynh' }, { id: 'journal', label: 'Nhật ký' },
  { id: 'theme-settings', label: 'Giao diện' }, { id: 'settings', label: 'Cài đặt' },
  { id: 'admin-panel', label: 'Quản trị' },
];

const validId = /^[A-Za-z0-9_-]{10,128}$/;

export function parseDriveId(value: string): string | null {
  const trimmed = value.trim();
  if (validId.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' || !['drive.google.com', 'docs.google.com'].includes(url.hostname)) return null;
    const candidate = url.pathname.match(/\/d\/([A-Za-z0-9_-]+)/)?.[1] || url.searchParams.get('id');
    return candidate && validId.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

/** A Drive share URL only contains an opaque ID; use a filename when available. */
export function inferMediaKind(filenameOrUrl: string): MediaKind | null {
  const text = filenameOrUrl.toLowerCase().split(/[?#]/)[0];
  if (/\.(png|jpe?g|webp|gif|avif|svg)$/.test(text)) return 'image';
  if (/\.(mp3|wav|m4a|ogg|aac|flac)$/.test(text)) return 'audio';
  if (/\.(mp4|webm|mov|m4v)$/.test(text)) return 'video';
  if (/\.(pdf|docx?|pptx?|xlsx?|txt|epub)$/.test(text) || /docs\.google\.com\//.test(text)) return 'file';
  return null;
}

export function mediaKindFromMime(mimeType: string, name: string): MediaKind {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return inferMediaKind(name) || 'file';
}

function validItem(raw: unknown): raw is PageMediaItem {
  if (!raw || typeof raw !== 'object') return false;
  const item = raw as PageMediaItem;
  return typeof item.id === 'string' && item.id.length < 100 &&
    typeof item.title === 'string' && item.title.length <= 120 &&
    typeof item.driveId === 'string' && (item.kind === 'text' ? item.driveId === '' : validId.test(item.driveId)) &&
    ['text', 'image', 'audio', 'video', 'file'].includes(item.kind) &&
    ['top', 'bottom'].includes(item.position) &&
    (!item.display || ['card', 'banner', 'popup'].includes(item.display)) &&
    (!item.description || item.description.length <= 1000) &&
    (!item.icon || item.icon.length <= 24) &&
    (!item.actionUrl || /^https:\/\//.test(item.actionUrl));
}

export function subscribePageMedia(pageKey: ActiveTab, onChange: (items: PageMediaItem[]) => void): () => void {
  return onSnapshot(doc(db, 'pageMedia', pageKey), (snapshot) => {
    const items = snapshot.data()?.items;
    onChange(Array.isArray(items) ? items.filter(validItem).slice(0, 100) : []);
  }, () => onChange([]));
}

export async function savePageMedia(pageKey: ActiveTab, items: PageMediaItem[]): Promise<void> {
  if (!(await isTrustedAdmin(auth.currentUser))) throw new Error('Tài khoản Google chưa được cấp quyền quản trị Firebase.');
  if (items.length > 100 || !items.every(validItem)) throw new Error('Danh sách nội dung vượt quá 100 mục hoặc có dữ liệu không hợp lệ.');
  await setDoc(doc(db, 'pageMedia', pageKey), { items, updatedAt: serverTimestamp() });
}

export function drivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
}

export function driveThumbnailUrl(fileId: string, size: number = 400): string {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${size}`;
}

export function driveOpenUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
}
