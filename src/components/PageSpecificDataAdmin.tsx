import React, { useState, useEffect, useMemo } from 'react';
import type { DriveFolderFile } from '../lib/driveFolder';
import { parseDriveId } from '../lib/driveMedia';
import {
  subscribePageData,
  savePageData,
  getDefaultPageData,
  type PageDataItem
} from '../lib/pageContentService';
import { audioService } from '../utils/audio';

interface Props {
  pageKey: string;
  pageLabel: string;
  authorized: boolean;
  folderFiles: DriveFolderFile[];
  onMessage: (msg: string) => void;
}

export const PageSpecificDataAdmin: React.FC<Props> = ({
  pageKey,
  pageLabel,
  authorized,
  folderFiles,
  onMessage,
}) => {
  const [items, setItems] = useState<PageDataItem[]>(() => getDefaultPageData(pageKey));
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15; // 15 items per page for instant smooth rendering

  // New item form state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSubtitle, setDraftSubtitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftIcon, setDraftIcon] = useState('📘');
  const [draftBadge, setDraftBadge] = useState('');
  const [draftGrade, setDraftGrade] = useState<1 | 2 | 3 | 4 | 5 | 0>(0);
  const [draftLevel, setDraftLevel] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [draftImageDriveId, setDraftImageDriveId] = useState('');
  const [draftAudioDriveId, setDraftAudioDriveId] = useState('');
  const [draftAudioEnUrl, setDraftAudioEnUrl] = useState('');
  const [draftAudioViUrl, setDraftAudioViUrl] = useState('');
  const [draftAudioExampleEnUrl, setDraftAudioExampleEnUrl] = useState('');
  const [draftAudioExampleViUrl, setDraftAudioExampleViUrl] = useState('');
  const [draftVideoDriveId, setDraftVideoDriveId] = useState('');
  const [draftActionUrl, setDraftActionUrl] = useState('');
  const [draftOptionsText, setDraftOptionsText] = useState('');
  const [draftCorrectAnswer, setDraftCorrectAnswer] = useState('');
  const [draftExplanation, setDraftExplanation] = useState('');

  // Subscribe to live Firestore pageContent for THIS pageKey with instant preloaded default
  useEffect(() => {
    const defaults = getDefaultPageData(pageKey);
    setItems(defaults); // Instant display with 0ms delay
    return subscribePageData(pageKey, (liveItems) => {
      if (liveItems && liveItems.length > 0) {
        setItems(liveItems);
      } else {
        setItems(defaults);
      }
    });
  }, [pageKey]);

  const resetForm = () => {
    setDraftTitle('');
    setDraftSubtitle('');
    setDraftContent('');
    setDraftCategory('');
    setDraftIcon('📘');
    setDraftBadge('');
    setDraftGrade(0);
    setDraftLevel('easy');
    setDraftImageDriveId('');
    setDraftAudioDriveId('');
    setDraftAudioEnUrl('');
    setDraftAudioViUrl('');
    setDraftAudioExampleEnUrl('');
    setDraftAudioExampleViUrl('');
    setDraftVideoDriveId('');
    setDraftActionUrl('');
    setDraftOptionsText('');
    setDraftCorrectAnswer('');
    setDraftExplanation('');
    setShowAddForm(false);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle.trim()) {
      onMessage('⚠️ Vui lòng nhập tiêu đề cho mục nội dung.');
      return;
    }

    const options = draftOptionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const newItem: PageDataItem = {
      id: `item-${pageKey}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pageKey,
      title: draftTitle.trim(),
      subtitle: draftSubtitle.trim() || undefined,
      content: draftContent.trim() || undefined,
      category: draftCategory.trim() || undefined,
      icon: draftIcon.trim() || '📘',
      badge: draftBadge.trim() || undefined,
      grade: draftGrade > 0 ? (draftGrade as 1 | 2 | 3 | 4 | 5) : undefined,
      level: draftLevel,
      imageDriveId: parseDriveId(draftImageDriveId) || draftImageDriveId.trim() || undefined,
      audioDriveId: parseDriveId(draftAudioDriveId) || draftAudioDriveId.trim() || undefined,
      audioEnUrl: draftAudioEnUrl.trim() || undefined,
      audioViUrl: draftAudioViUrl.trim() || undefined,
      audioExampleEnUrl: draftAudioExampleEnUrl.trim() || undefined,
      audioExampleViUrl: draftAudioExampleViUrl.trim() || undefined,
      videoDriveId: parseDriveId(draftVideoDriveId) || draftVideoDriveId.trim() || undefined,
      actionUrl: draftActionUrl.trim() || undefined,
      options: options.length > 0 ? options : undefined,
      correctAnswer: draftCorrectAnswer.trim() || undefined,
      explanation: draftExplanation.trim() || undefined,
      order: items.length,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setItems((prev) => [...prev, newItem]);
    resetForm();
    onMessage(`Đã thêm mục "${newItem.title}" vào bản nháp trang ${pageLabel}. Hãy bấm "Lưu dữ liệu trang lên Firebase" để xuất bản.`);
  };

  const handleSaveToFirebase = async () => {
    setSaving(true);
    try {
      await savePageData(pageKey, items);
      onMessage(`✅ Đã lưu thành công ${items.length} mục dữ liệu chuyên biệt của trang [${pageLabel}] lên Firebase!`);
    } catch (err: any) {
      console.error(err);
      onMessage(`❌ Lỗi khi lưu dữ liệu trang ${pageLabel}: ${err?.message || String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadDefaultData = () => {
    const defaults = getDefaultPageData(pageKey);
    setItems(defaults);
    onMessage(`Đã nạp ${defaults.length} mục dữ liệu mẫu chuẩn cho trang [${pageLabel}]. Kiểm tra rồi bấm Lưu lên Firebase.`);
  };

  const handleToggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (confirm(`Bạn có chắc muốn xóa mục "${item?.title || id}" khỏi trang ${pageLabel}?`)) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      onMessage(`Đã xóa mục khỏi bản nháp trang ${pageLabel}.`);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setItems(next);
  };

  const handleDuplicate = (item: PageDataItem) => {
    const dup: PageDataItem = {
      ...item,
      id: `item-${pageKey}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${item.title} (Bản sao)`,
      order: items.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, dup]);
    onMessage(`Đã nhân bản "${item.title}".`);
  };

  const handleUpdateItemField = (id: string, patch: Partial<PageDataItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
      )
    );
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        (item.content && item.content.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));

      const matchLevel = filterLevel === 'all' || item.level === filterLevel;
      return matchQuery && matchLevel;
    });
  }, [items, searchQuery, filterLevel]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageKey, searchQuery, filterLevel]);

  return (
    <section className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-b from-indigo-50/70 to-white p-4 sm:p-6 shadow-sm space-y-4">
      {/* Page Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📑</span>
            <h3 className="text-lg font-black text-indigo-950">
              Dữ liệu chuyên biệt riêng của trang: <span className="text-indigo-600">[{pageLabel}]</span>
            </h3>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
              pageKey: {pageKey}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600 font-medium">
            Toàn bộ nội dung, câu hỏi, bài tập, audio, ảnh và cấu hình dưới đây được nạp tự động sẵn cho trang{' '}
            <b>{pageLabel}</b> ({items.length} mục dữ liệu sẵn sàng).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLoadDefaultData}
            disabled={!authorized}
            className="rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Tải lại bộ dữ liệu mẫu chuẩn của trang này"
          >
            🔄 Tải lại dữ liệu mẫu ({items.length} mục đã nạp sẵn)
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            disabled={!authorized}
            className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-2xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>{showAddForm ? '✕ Đóng form' : '➕ Thêm mục mới'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToFirebase}
            disabled={!authorized || saving}
            className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-black text-white hover:bg-emerald-700 shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 animate-pulse"
          >
            <span>{saving ? '⏳ Đang lưu...' : '💾 Lưu trang lên Firebase'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs font-bold">
        <div className="rounded-xl border border-indigo-100 bg-white p-2.5 shadow-2xs">
          <span className="text-slate-500">Tổng số mục dữ liệu:</span>
          <p className="text-base font-black text-indigo-700">{items.length} mục</p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white p-2.5 shadow-2xs">
          <span className="text-slate-500">Đang bật hiển thị:</span>
          <p className="text-base font-black text-emerald-600">{items.filter((i) => i.enabled).length} mục</p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white p-2.5 shadow-2xs">
          <span className="text-slate-500">Đang ẩn:</span>
          <p className="text-base font-black text-amber-600">{items.filter((i) => !i.enabled).length} mục</p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-white p-2.5 shadow-2xs">
          <span className="text-slate-500">Kho Drive liên kết:</span>
          <p className="text-base font-black text-blue-600">{folderFiles.length} tệp</p>
        </div>
      </div>

      {/* Add New Item Form */}
      {showAddForm && (
        <form onSubmit={handleAddItem} className="rounded-2xl border border-indigo-300 bg-white p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="text-sm font-black text-indigo-900">Thêm mục mới vào trang [{pageLabel}]</h4>
            <span className="text-xs text-slate-500">Điền các trường cần thiết bên dưới</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs font-bold text-slate-700">
            <div>
              <label className="block mb-1">Tiêu đề mục (Title) *:</label>
              <input
                type="text"
                required
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Ví dụ: Unit 1: My Friends hoặc Bài nghe Zoo..."
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1">Phụ đề / Câu mẫu / Nghĩa (Subtitle):</label>
              <input
                type="text"
                value={draftSubtitle}
                onChange={(e) => setDraftSubtitle(e.target.value)}
                placeholder="Ví dụ: Miêu tả đồ vật xung quanh em..."
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1">Biểu tượng / Emoji (Icon):</label>
              <input
                type="text"
                value={draftIcon}
                onChange={(e) => setDraftIcon(e.target.value)}
                placeholder="✨ 🎧 🦁 🎨 📚"
                maxLength={8}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1">Nhãn nổi bật (Badge):</label>
              <input
                type="text"
                value={draftBadge}
                onChange={(e) => setDraftBadge(e.target.value)}
                placeholder="Ví dụ: Nổi bật, Trọng tâm, Bài 1, Mới..."
                maxLength={20}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block mb-1">Khối lớp (Grade):</label>
              <select
                value={draftGrade}
                onChange={(e) => setDraftGrade(Number(e.target.value) as any)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white"
              >
                <option value={0}>-- Chung cho mọi lớp --</option>
                <option value={1}>Lớp 1</option>
                <option value={2}>Lớp 2</option>
                <option value={3}>Lớp 3</option>
                <option value={4}>Lớp 4</option>
                <option value={5}>Lớp 5</option>
              </select>
            </div>

            <div>
              <label className="block mb-1">Mức độ (Level):</label>
              <select
                value={draftLevel}
                onChange={(e) => setDraftLevel(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white"
              >
                <option value="easy">Dễ (Easy)</option>
                <option value="medium">Trung bình (Medium)</option>
                <option value="hard">Nâng cao (Hard)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1">Nội dung chi tiết / Đoạn văn / Transcript / Giải thích:</label>
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Nhập nội dung bài học, kịch bản nghe, bài tập, câu chuyện..."
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 p-3 bg-indigo-50/80 rounded-2xl border border-indigo-100 space-y-2.5">
              <p className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                <span>🎵 Link Audio Phát Âm Cho Trang Này:</span>
                <span className="text-[10px] font-normal text-indigo-600">(Hỗ trợ URL trực tiếp, Google Drive hoặc file MP3)</span>
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={draftAudioEnUrl}
                    onChange={(e) => setDraftAudioEnUrl(e.target.value)}
                    placeholder="Link audio phát âm tiếng Anh (URL/Drive)"
                    className="flex-1 rounded-xl border border-slate-300 p-2 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => audioService.playEnglishWord(draftTitle || 'Lesson', draftAudioEnUrl || draftAudioDriveId)}
                    className="px-2.5 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    🔊 Thử EN
                  </button>
                </div>

                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={draftAudioViUrl}
                    onChange={(e) => setDraftAudioViUrl(e.target.value)}
                    placeholder="Link audio phát âm tiếng Việt (URL/Drive)"
                    className="flex-1 rounded-xl border border-slate-300 p-2 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => audioService.playVietnameseMeaning(draftSubtitle || draftTitle || 'Bài học', draftAudioViUrl)}
                    className="px-2.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    🇻🇳 Thử VI
                  </button>
                </div>

                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={draftAudioExampleEnUrl}
                    onChange={(e) => setDraftAudioExampleEnUrl(e.target.value)}
                    placeholder="Link audio câu ví dụ / đoạn văn tiếng Anh"
                    className="flex-1 rounded-xl border border-slate-300 p-2 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => audioService.playEnglishSentence(draftContent || draftTitle || 'Example sentence', draftAudioExampleEnUrl)}
                    className="px-2.5 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-700 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    💬 Ví dụ EN
                  </button>
                </div>

                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    value={draftAudioExampleViUrl}
                    onChange={(e) => setDraftAudioExampleViUrl(e.target.value)}
                    placeholder="Link audio câu ví dụ / giải thích tiếng Việt"
                    className="flex-1 rounded-xl border border-slate-300 p-2 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => audioService.playVietnameseSentence(draftExplanation || draftContent || 'Câu ví dụ tiếng Việt', draftAudioExampleViUrl)}
                    className="px-2.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    📝 Ví dụ VI
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-1">Google Drive Audio ID hoặc Link:</label>
              <input
                type="text"
                value={draftAudioDriveId}
                onChange={(e) => setDraftAudioDriveId(e.target.value)}
                placeholder="1vkhCC... hoặc link chia sẻ Drive"
                className="w-full rounded-xl border border-slate-300 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block mb-1">Google Drive Ảnh ID hoặc Link:</label>
              <input
                type="text"
                value={draftImageDriveId}
                onChange={(e) => setDraftImageDriveId(e.target.value)}
                placeholder="1vkhCC... hoặc link chia sẻ Drive"
                className="w-full rounded-xl border border-slate-300 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block mb-1">Google Drive Video ID hoặc YouTube URL:</label>
              <input
                type="text"
                value={draftVideoDriveId}
                onChange={(e) => setDraftVideoDriveId(e.target.value)}
                placeholder="Link YouTube hoặc ID video Drive"
                className="w-full rounded-xl border border-slate-300 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block mb-1">Liên kết hành động (Action URL):</label>
              <input
                type="text"
                value={draftActionUrl}
                onChange={(e) => setDraftActionUrl(e.target.value)}
                placeholder="https://... hoặc #link"
                className="w-full rounded-xl border border-slate-300 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block mb-1">Tùy chọn trắc nghiệm (mỗi dòng 1 phương án):</label>
              <textarea
                value={draftOptionsText}
                onChange={(e) => setDraftOptionsText(e.target.value)}
                placeholder="Phương án A&#10;Phương án B&#10;Phương án C&#10;Phương án D"
                rows={2}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block mb-1">Đáp án đúng & Giải thích ngắn:</label>
              <input
                type="text"
                value={draftCorrectAnswer}
                onChange={(e) => setDraftCorrectAnswer(e.target.value)}
                placeholder="Ví dụ: Phương án A"
                className="w-full rounded-xl border border-slate-300 p-2 text-xs mb-1.5"
              />
              <input
                type="text"
                value={draftExplanation}
                onChange={(e) => setDraftExplanation(e.target.value)}
                placeholder="Giải thích vì sao đúng..."
                className="w-full rounded-xl border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-black text-white hover:bg-indigo-700 shadow-sm transition cursor-pointer"
            >
              Thêm vào danh sách trang
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-indigo-100/50 p-2 text-xs font-bold">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-slate-500">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Tìm kiếm trong ${items.length} mục của trang ${pageLabel}...`}
            className="w-full rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Mức độ:</span>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="rounded-lg border border-indigo-200 bg-white p-1.5 text-xs font-bold"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="easy">Dễ (Easy)</option>
            <option value="medium">Trung bình (Medium)</option>
            <option value="hard">Nâng cao (Hard)</option>
          </select>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-indigo-200 p-8 text-center text-xs text-slate-500 space-y-2">
            <p className="text-3xl">📭</p>
            <p className="font-bold text-slate-700">Chưa có dữ liệu nào cho trang [{pageLabel}]</p>
            <p>Bấm nút <b>"🔄 Tải lại dữ liệu mẫu"</b> để nạp lại dữ liệu mẫu chuẩn, hoặc bấm <b>"➕ Thêm mục mới"</b> để soạn nội dung.</p>
          </div>
        ) : (
          paginatedItems.map((item, index) => (
            <details
              key={item.id}
              className={`rounded-xl border transition shadow-2xs ${
                item.enabled
                  ? 'border-indigo-200 bg-white hover:border-indigo-300'
                  : 'border-slate-200 bg-slate-50/80 opacity-70'
              }`}
            >
              <summary className="flex cursor-pointer items-center justify-between p-3 select-none">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="text-lg shrink-0">{item.icon || '📄'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900 truncate">{item.title}</span>
                      {item.badge && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.2 text-[10px] font-black text-amber-800">
                          {item.badge}
                        </span>
                      )}
                      {item.grade && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.2 text-[10px] font-bold text-blue-700">
                          Lớp {item.grade}
                        </span>
                      )}
                      {item.level && (
                        <span
                          className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                            item.level === 'easy'
                              ? 'bg-emerald-100 text-emerald-700'
                              : item.level === 'medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.level}
                        </span>
                      )}
                      {!item.enabled && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.2 text-[10px] font-bold text-slate-600">
                          Đang ẩn
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleToggleItem(item.id)}
                    className={`rounded-lg px-2 py-1 text-[11px] font-bold transition cursor-pointer ${
                      item.enabled
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                    title={item.enabled ? 'Bấm để ẩn khỏi trang' : 'Bấm để bật hiển thị'}
                  >
                    {item.enabled ? '✓ Bật' : '✕ Ẩn'}
                  </button>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Lên trên"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === filteredItems.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Xuống dưới"
                  >
                    ↓
                  </button>
                </div>
              </summary>

              {/* Expanded Item Details & Inline Edit */}
              <div className="border-t border-indigo-100 p-3 bg-indigo-50/30 text-xs font-bold text-slate-700 space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="block mb-0.5 text-slate-500">Tiêu đề:</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleUpdateItemField(item.id, { title: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-0.5 text-slate-500">Phụ đề:</label>
                    <input
                      type="text"
                      value={item.subtitle || ''}
                      onChange={(e) => handleUpdateItemField(item.id, { subtitle: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-0.5 text-slate-500">Biểu tượng Icon:</label>
                    <input
                      type="text"
                      value={item.icon || ''}
                      onChange={(e) => handleUpdateItemField(item.id, { icon: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-0.5 text-slate-500">Nhãn Badge:</label>
                    <input
                      type="text"
                      value={item.badge || ''}
                      onChange={(e) => handleUpdateItemField(item.id, { badge: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-0.5 text-slate-500">Nội dung chi tiết:</label>
                    <textarea
                      value={item.content || ''}
                      onChange={(e) => handleUpdateItemField(item.id, { content: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2 p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-2">
                    <p className="text-xs font-black text-indigo-900">🎵 Link Audio Phát Âm Chuyên Biệt:</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={item.audioEnUrl || ''}
                          onChange={(e) => handleUpdateItemField(item.id, { audioEnUrl: e.target.value.trim() || undefined })}
                          placeholder="Link audio phát âm tiếng Anh (URL/Drive)"
                          className="flex-1 rounded border border-slate-300 bg-white p-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => audioService.playEnglishWord(item.title, item.audioEnUrl || item.audioDriveId)}
                          className="px-2 py-1.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          🔊 Thử EN
                        </button>
                      </div>

                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={item.audioViUrl || ''}
                          onChange={(e) => handleUpdateItemField(item.id, { audioViUrl: e.target.value.trim() || undefined })}
                          placeholder="Link audio phát âm tiếng Việt (URL/Drive)"
                          className="flex-1 rounded border border-slate-300 bg-white p-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => audioService.playVietnameseMeaning(item.subtitle || item.title, item.audioViUrl)}
                          className="px-2 py-1.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          🇻🇳 Thử VI
                        </button>
                      </div>

                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={item.audioExampleEnUrl || ''}
                          onChange={(e) => handleUpdateItemField(item.id, { audioExampleEnUrl: e.target.value.trim() || undefined })}
                          placeholder="Link audio câu ví dụ tiếng Anh"
                          className="flex-1 rounded border border-slate-300 bg-white p-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => audioService.playEnglishSentence(item.content || item.title, item.audioExampleEnUrl)}
                          className="px-2 py-1.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-700 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          💬 Ví dụ EN
                        </button>
                      </div>

                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={item.audioExampleViUrl || ''}
                          onChange={(e) => handleUpdateItemField(item.id, { audioExampleViUrl: e.target.value.trim() || undefined })}
                          placeholder="Link audio câu ví dụ tiếng Việt"
                          className="flex-1 rounded border border-slate-300 bg-white p-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => audioService.playVietnameseSentence(item.explanation || item.content || 'Câu ví dụ', item.audioExampleViUrl)}
                          className="px-2 py-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-bold shrink-0 cursor-pointer"
                        >
                          📝 Ví dụ VI
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-0.5 text-slate-500">Audio Drive ID (Gốc):</label>
                    <input
                      type="text"
                      value={item.audioDriveId || ''}
                      onChange={(e) => handleUpdateItemField(item.id, { audioDriveId: parseDriveId(e.target.value) || e.target.value })}
                      placeholder="ID hoặc link Drive"
                      className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block mb-0.5 text-slate-500">Ảnh Drive ID:</label>
                    <input
                      type="text"
                      value={item.imageDriveId || ''}
                      onChange={(e) => handleUpdateItemField(item.id, { imageDriveId: parseDriveId(e.target.value) || e.target.value })}
                      placeholder="ID hoặc link Drive"
                      className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                    />
                  </div>
                  {item.options && item.options.length > 0 && (
                    <div className="sm:col-span-2">
                      <label className="block mb-0.5 text-slate-500">Đáp án đúng & Giải thích:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.correctAnswer || ''}
                          onChange={(e) => handleUpdateItemField(item.id, { correctAnswer: e.target.value })}
                          placeholder="Đáp án đúng"
                          className="flex-1 rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                        />
                        <input
                          type="text"
                          value={item.explanation || ''}
                          onChange={(e) => handleUpdateItemField(item.id, { explanation: e.target.value })}
                          placeholder="Giải thích"
                          className="flex-1 rounded-lg border border-slate-300 bg-white p-1.5 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-indigo-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(item)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      📋 Nhân bản
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer"
                    >
                      🗑️ Xóa mục
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400">ID: {item.id}</span>
                </div>
              </div>
            </details>
          ))
        )}
      </div>

      {/* Pagination Navigation Bar */}
      {totalPages > 1 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-indigo-50/80 rounded-xl text-xs font-bold text-indigo-900 select-none border border-indigo-200">
          <div className="flex items-center gap-1.5">
            <span>Đang hiển thị mục:</span>
            <span className="text-indigo-700 font-black">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}
            </span>
            <span className="text-slate-500">/ tổng số {filteredItems.length} mục</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 disabled:opacity-40 cursor-pointer shadow-2xs font-extrabold text-indigo-800"
            >
              ◀ Trước
            </button>
            <span className="px-2.5 py-1 bg-white text-indigo-700 rounded-lg font-black border border-indigo-200">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 disabled:opacity-40 cursor-pointer shadow-2xs font-extrabold text-indigo-800"
            >
              Tiếp ▶
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
