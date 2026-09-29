import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { MEDIA_FOLDER_URL, MEDIA_PAGES, inferMediaKind, parseDriveId, savePageMedia, subscribePageMedia, type MediaDisplay, type MediaKind, type MediaPosition, type PageMediaItem } from '../lib/driveMedia';
import { listMediaFolder, type DriveFolderFile } from '../lib/driveFolder';
import type { ActiveTab } from '../types';
import { isTrustedAdmin } from '../lib/adminAccess';
import { customPageId, DEFAULT_MENU_CONFIG, saveCustomPages, saveMenuConfig, subscribeCustomPages, subscribeMenuConfig, type CustomPage, type MenuConfig } from '../lib/siteContent';
import { normalizeVocabularyKey, subscribeVocabularyContent, type ManagedVocabularyItem } from '../lib/pageContent';
import { VocabularyContentAdmin } from './VocabularyContentAdmin';
import { PageSpecificDataAdmin } from './PageSpecificDataAdmin';

const MENU_ITEMS = [
  ['home', 'Trang chủ'], ['roadmap', 'Lộ trình học'], ['skills', 'Luyện kỹ năng'],
  ['linear', 'Trạm Tư Duy Linear'], ['fun', 'Trò Chơi - Relax'], ['manage', 'Góc Quản lý'],
  ['admin-panel', 'Trang Quản Trị Admin'], ['journal', 'Nhật ký & Notes'],
  ['theme-settings', 'Chủ đề hiển thị'], ['settings', 'Cài đặt'],
] as const;

export const DriveMediaAdmin: React.FC = () => {
  const [page, setPage] = useState<ActiveTab>('home');
  const [items, setItems] = useState<PageMediaItem[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [kind, setKind] = useState<MediaKind>('file');
  const [kindManual, setKindManual] = useState(false);
  const [position, setPosition] = useState<MediaPosition>('bottom');
  const [display, setDisplay] = useState<MediaDisplay>('card');
  const [description, setDescription] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [icon, setIcon] = useState('');
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [menuConfig, setMenuConfig] = useState<MenuConfig>(DEFAULT_MENU_CONFIG);
  const [newPage, setNewPage] = useState({ slug: '', menuLabel: '', title: '', description: '', icon: '📘' });
  const [authorized, setAuthorized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [folderFiles, setFolderFiles] = useState<DriveFolderFile[]>([]);
  const [vocabularyItems, setVocabularyItems] = useState<ManagedVocabularyItem[]>([]);
  const [loadingFolder, setLoadingFolder] = useState(false);
  const [workspace, setWorkspace] = useState<'data' | 'media' | 'drive' | 'page'>('data');

  const currentPageLabel = MEDIA_PAGES.find(entry => entry.id === page)?.label || customPages.find(entry => entry.id === page)?.menuLabel || page;

  useEffect(() => onAuthStateChanged(auth, async (current) => {
    setAuthorized(await isTrustedAdmin(current || null));
  }), []);
  useEffect(() => {
    setItems([]);
    setMessage('');
    setTitle('');
    setUrl('');
    setDescription('');
    setActionUrl('');
    setIcon('');
    setKind('file');
    setDisplay('card');
    setKindManual(false);
    return subscribePageMedia(page, setItems);
  }, [page]);
  useEffect(() => subscribeCustomPages(setCustomPages), []);
  useEffect(() => subscribeMenuConfig(setMenuConfig), []);
  useEffect(() => subscribeVocabularyContent(setVocabularyItems), []);

  const saveMenu = async () => {
    setSaving(true);
    try {
      await saveMenuConfig(menuConfig);
      setMessage('Đã lưu thương hiệu và nội dung menu lên Firebase.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không lưu được menu.');
    } finally { setSaving(false); }
  };

  const add = () => {
    const driveId = kind === 'text' ? '' : parseDriveId(url);
    if ((kind !== 'text' && !driveId) || !title.trim()) return setMessage(kind === 'text' ? 'Nhập tiêu đề nội dung.' : 'Nhập tên tệp và liên kết Google Drive hợp lệ.');
    if (items.length >= 100) return setMessage('Mỗi trang được tối đa 100 mục nội dung.');
    if (actionUrl.trim() && !/^https:\/\//.test(actionUrl.trim())) return setMessage('Nút liên kết phải bắt đầu bằng https://');
    setItems((current) => [...current, { id: crypto.randomUUID(), driveId, title: title.trim().slice(0, 120), kind, position, display, description: description.trim().slice(0, 1000), actionUrl: actionUrl.trim() || undefined, icon: icon.trim() || undefined }]);
    setTitle(''); setUrl(''); setDescription(''); setActionUrl(''); setIcon(''); setKind('file'); setDisplay('card'); setKindManual(false); setMessage('Đã thêm vào bản nháp. Bấm Lưu để áp dụng.');
  };
  const save = async () => {
    setSaving(true);
    try {
      await savePageMedia(page, items);
      setMessage('Đã lưu tư liệu cho trang này.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể lưu. Kiểm tra quyền Firebase và kết nối.');
    } finally { setSaving(false); }
  };
  const refreshFolder = async () => {
    setLoadingFolder(true);
    try {
      const files = await listMediaFolder();
      setFolderFiles(files);
      setMessage(`Đã tìm thấy ${files.length} tệp trong thư mục. Chọn tệp và lưu trang để hiển thị.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không đọc được thư mục Drive.');
    } finally { setLoadingFolder(false); }
  };
  const attachFile = (file: DriveFolderFile) => {
    if (items.length >= 100) return setMessage('Mỗi trang được tối đa 100 mục nội dung.');
    if (items.some((item) => item.driveId === file.id)) return setMessage('Tệp này đã có trên trang.');
    setItems((current) => [...current, { id: crypto.randomUUID(), driveId: file.id, title: file.name.slice(0, 120), kind: file.kind, position, display }]);
    setMessage('Đã gán vào bản nháp. Bấm Lưu thay đổi để đăng lên trang.');
  };

  const autoAttachForPage = () => {
    const label = MEDIA_PAGES.find(entry => entry.id === page)?.label || customPages.find(entry => entry.id === page)?.menuLabel || page;
    const keys = [normalizeVocabularyKey(String(page).replace(/^custom-/, '')), normalizeVocabularyKey(label)].filter(Boolean);
    const matches = folderFiles.filter(file => keys.some(key => normalizeVocabularyKey(file.name).includes(key)))
      .filter(file => !items.some(item => item.driveId === file.id)).slice(0, Math.max(0, 100 - items.length));
    if (!matches.length) return setMessage('Không tìm thấy tệp có tên phù hợp với trang này. Có thể gán tệp thủ công.');
    setItems(current => [...current, ...matches.map(file => ({ id: crypto.randomUUID(), driveId: file.id, title: file.name.slice(0, 120), kind: file.kind, position, display }))]);
    setMessage(`Đã tự ghép ${matches.length} tệp vào bản nháp của trang ${label}.`);
  };

  const createPage = async () => {
    const slug = newPage.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
    if (!slug || !newPage.menuLabel.trim() || !newPage.title.trim()) return setMessage('Nhập slug, tên menu và tiêu đề trang.');
    if (customPages.some((entry) => entry.slug === slug)) return setMessage('Slug trang đã tồn tại.');
    const entry: CustomPage = { id: customPageId(slug), slug, menuLabel: newPage.menuLabel.trim(), title: newPage.title.trim(), description: newPage.description.trim(), icon: newPage.icon.trim() || '📘', enabled: true };
    try {
      await saveCustomPages([...customPages, entry]);
      setNewPage({ slug: '', menuLabel: '', title: '', description: '', icon: '📘' });
      setPage(entry.id); setMessage('Đã tạo trang và menu mới. Bây giờ có thể gán tư liệu cho trang.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Không tạo được trang.'); }
  };

  return <section className="min-w-0 rounded-2xl border border-sky-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
    <div>
      <h2 className="text-xl font-bold text-slate-900">CMS dữ liệu theo từng trang</h2>
      <p className="text-sm text-slate-600">Firebase lưu dữ liệu trang; Google Drive chỉ cung cấp ảnh, audio, video và tệp qua liên kết.</p>
    </div>
    {!authorized && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Để chỉnh sửa, đăng nhập Google với tài khoản được cấp custom claim <code>admin: true</code> trong Firebase Auth. Bạn vẫn có thể xem danh sách hiện tại.</p>}
    {workspace === 'drive' && <details open className="rounded-xl border border-sky-100 bg-sky-50 p-3 space-y-2">
      <summary className="cursor-pointer font-semibold text-slate-800">Kho tệp Google Drive · mở để quét và gán tệp</summary>
      <a href={MEDIA_FOLDER_URL} target="_blank" rel="noopener noreferrer" className="block break-all text-sm text-blue-700 underline">{MEDIA_FOLDER_URL}</a>
      <p className="text-xs text-slate-600">Tải tệp lên thư mục này trên Drive, rồi bấm Quét thư mục để lấy tên và nhận loại từ định dạng tệp. Google sẽ yêu cầu quyền đọc danh sách tệp cho Admin.</p>
      <button type="button" onClick={refreshFolder} disabled={!authorized || loadingFolder} className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{loadingFolder ? 'Đang quét…' : 'Quét thư mục Drive'}</button>
      {folderFiles.length > 0 && <ul className="max-h-52 overflow-y-auto space-y-1">{folderFiles.map((file) => <li key={file.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2 text-sm">
        <span className="min-w-0 flex-1 break-words">{file.name} · {file.kind}</span>
        <button type="button" onClick={() => attachFile(file)} disabled={!authorized || items.some((entry) => entry.driveId === file.id)} className="rounded-lg bg-sky-700 px-2 py-1 text-white disabled:opacity-40">Gán vào trang</button>
      </li>)}</ul>}
    </details>}
    <label className="block text-sm font-semibold text-slate-700">Trang hiển thị
      <select value={page} onChange={(event) => setPage(event.target.value as ActiveTab)} className="mt-1 w-full rounded-lg border p-2 bg-white">
        {MEDIA_PAGES.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
        {customPages.map((entry) => <option key={entry.id} value={entry.id}>Trang mới · {entry.menuLabel}</option>)}
      </select>
    </label>
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="rounded-xl border bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Trang đang quản lý</p><p className="font-black text-slate-900">{currentPageLabel}</p></div>
      <div className="rounded-xl border bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Dữ liệu trang (Firebase)</p><p className="font-black text-slate-900">{page === 'vocab' ? `${vocabularyItems.length} từ vựng` : 'Dữ liệu chuyên biệt riêng'}</p></div>
      <div className="rounded-xl border bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">Media riêng của trang</p><p className="font-black text-slate-900">{items.length} khối riêng</p></div>
    </div>
    <nav className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-2 sm:grid-cols-4" aria-label="Công cụ CMS">
      {([['data','Dữ liệu trang'],['media','Nội dung & media'],['drive','Kho Drive'],['page','Cấu hình trang']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setWorkspace(id)} className={`rounded-lg px-3 py-2 text-sm font-bold ${workspace === id ? 'bg-sky-700 text-white shadow' : 'bg-white text-slate-700'}`}>{label}</button>)}
    </nav>
    {message && <p role="status" className="rounded-lg bg-amber-50 p-2 text-sm text-slate-700">{message}</p>}
    {workspace === 'data' && page === 'vocab' && <VocabularyContentAdmin items={vocabularyItems} authorized={authorized} folderFiles={folderFiles} onMessage={setMessage} />}
    {workspace === 'data' && page !== 'vocab' && (
      <PageSpecificDataAdmin
        pageKey={page}
        pageLabel={currentPageLabel}
        authorized={authorized}
        folderFiles={folderFiles}
        onMessage={setMessage}
      />
    )}
    {workspace === 'media' && <><details key={`add-${page}`} className="rounded-xl border border-sky-200 bg-sky-50/40 p-3" open>
      <summary className="cursor-pointer font-bold text-sky-950 flex flex-wrap items-center justify-between gap-1">
        <span>➕ Thêm nội dung, icon, sticker hoặc media vào riêng trang: [{currentPageLabel}]</span>
        <span className="text-xs font-semibold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full">pageKey: {page}</span>
      </summary>
    <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">Tên tư liệu (kèm đuôi tệp nếu có)<input value={title} onChange={(event) => { setTitle(event.target.value); const inferred = inferMediaKind(event.target.value) || inferMediaKind(url); if (inferred && !kindManual) setKind(inferred); }} maxLength={120} placeholder="Ví dụ: Bài nghe Unit 1.mp3" disabled={!authorized} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="text-sm font-semibold">Liên kết Drive<input value={url} onChange={(event) => { setUrl(event.target.value); const inferred = inferMediaKind(title) || inferMediaKind(event.target.value); if (inferred && !kindManual) setKind(inferred); }} placeholder="https://drive.google.com/file/d/.../view" disabled={!authorized} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="text-sm font-semibold">Loại nội dung<select value={kind} onChange={(event) => { setKind(event.target.value as MediaKind); setKindManual(true); }} disabled={!authorized} className="mt-1 w-full rounded-lg border p-2 bg-white"><option value="text">Chỉ văn bản</option><option value="image">Ảnh</option><option value="audio">Audio</option><option value="video">Video</option><option value="file">Tài liệu / tệp khác</option></select></label>
      <label className="text-sm font-semibold">Vị trí<select value={position} onChange={(event) => setPosition(event.target.value as MediaPosition)} disabled={!authorized} className="mt-1 w-full rounded-lg border p-2 bg-white"><option value="top">Đầu nội dung</option><option value="bottom">Cuối nội dung</option></select></label>
      <label className="text-sm font-semibold">Kiểu hiển thị<select value={display} onChange={(event) => setDisplay(event.target.value as MediaDisplay)} disabled={!authorized} className="mt-1 w-full rounded-lg border p-2 bg-white"><option value="card">Khối nội dung</option><option value="banner">Banner quảng cáo</option><option value="popup">Popup khi mở trang</option></select></label>
      <label className="text-sm font-semibold">Nút liên kết<input value={actionUrl} onChange={(event) => setActionUrl(event.target.value)} placeholder="https://..." disabled={!authorized} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="text-sm font-semibold">Icon hoặc sticker<input value={icon} onChange={(event) => setIcon(event.target.value)} placeholder="✨ 🦖 📘" maxLength={24} disabled={!authorized} className="mt-1 w-full rounded-lg border p-2" /></label>
      <label className="text-sm font-semibold sm:col-span-2">Nội dung chi tiết<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={4} placeholder="Text mô tả, thông báo hoặc nội dung quảng cáo" disabled={!authorized} className="mt-1 w-full rounded-lg border p-2" /></label>
    </div>
    <p className="text-xs text-slate-500">Tên có đuôi .jpg/.mp3/.mp4/.pdf sẽ tự chọn loại. Liên kết chia sẻ Drive thông thường chỉ có ID, không chứa kiểu tệp; hãy chọn loại thủ công nếu tên không có đuôi.</p>
    <button type="button" onClick={add} disabled={!authorized} className="rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Thêm vào trang {currentPageLabel}</button>
    </details>
    <details className="rounded-xl border border-blue-200 p-3" open>
      <summary className="cursor-pointer font-bold text-blue-950 flex flex-wrap items-center justify-between gap-1">
        <span>📋 Nội dung và media đang có của riêng trang [{currentPageLabel}] · {items.length}/100 mục</span>
        <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">Độc lập từng trang</span>
      </summary>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={autoAttachForPage} disabled={!authorized || !folderFiles.length || items.length >= 100} className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Tự ghép tệp Drive theo tên trang</button>
        {authorized && <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : `Lưu trang [${currentPageLabel}] lên Firebase`}</button>}
      </div>
      {items.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-6 text-center text-slate-600">
          <p className="font-bold text-blue-900">Trang [{currentPageLabel}] hiện chưa có khối nội dung hoặc media nào riêng biệt.</p>
          <p className="text-xs text-slate-500 mt-1">Dữ liệu và media của trang này hoàn toàn độc lập, không bị gộp chung với bất kỳ trang nào khác. Bạn hãy thêm văn bản, ảnh, audio, video, sticker hoặc banner ở trên để xuất bản cho trang này.</p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item, index) => (
            <details key={item.id} className="rounded-lg border bg-slate-50 p-2">
              <summary className="cursor-pointer text-sm font-bold">{index + 1}. {item.icon || '📄'} {item.title} · {item.kind} · {item.display || 'card'}</summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input value={item.title} onChange={e => setItems(list => list.map((entry, i) => i === index ? {...entry, title:e.target.value} : entry))} placeholder="Tiêu đề" className="rounded border p-2 text-sm" />
                <input value={item.icon || ''} onChange={e => setItems(list => list.map((entry, i) => i === index ? {...entry, icon:e.target.value} : entry))} placeholder="Icon / sticker" maxLength={24} className="rounded border p-2 text-sm" />
                <input value={item.driveId} onChange={e => setItems(list => list.map((entry, i) => i === index ? {...entry, driveId:parseDriveId(e.target.value) || e.target.value.trim()} : entry))} placeholder="ID hoặc link tệp Google Drive" disabled={item.kind === 'text'} className="rounded border p-2 text-sm sm:col-span-2 disabled:bg-slate-100" />
                <select value={item.kind} onChange={e => setItems(list => list.map((entry, i) => i === index ? {...entry, kind:e.target.value as MediaKind} : entry))} className="rounded border bg-white p-2 text-sm"><option value="text">Văn bản</option><option value="image">Ảnh</option><option value="audio">Audio</option><option value="video">Video</option><option value="file">Tệp</option></select>
                <select value={item.display || 'card'} onChange={e => setItems(list => list.map((entry, i) => i === index ? {...entry, display:e.target.value as MediaDisplay} : entry))} className="rounded border bg-white p-2 text-sm"><option value="card">Khối nội dung</option><option value="banner">Banner</option><option value="popup">Popup</option></select>
                <select value={item.position} onChange={e => setItems(list => list.map((entry, i) => i === index ? {...entry, position:e.target.value as MediaPosition} : entry))} className="rounded border bg-white p-2 text-sm"><option value="top">Đầu trang</option><option value="bottom">Cuối trang</option></select>
                <input value={item.actionUrl || ''} onChange={e => setItems(list => list.map((entry, i) => i === index ? {...entry, actionUrl:e.target.value || undefined} : entry))} placeholder="Link nút HTTPS" className="rounded border p-2 text-sm" />
                <textarea value={item.description || ''} onChange={e => setItems(list => list.map((entry, i) => i === index ? {...entry, description:e.target.value} : entry))} placeholder="Nội dung text" rows={3} className="rounded border p-2 text-sm sm:col-span-2" />
                <div className="flex flex-wrap gap-2 sm:col-span-2"><button type="button" disabled={index === 0} onClick={() => setItems(list => { const next=[...list]; [next[index-1],next[index]]=[next[index],next[index-1]]; return next; })} className="rounded border bg-white px-3 py-1 disabled:opacity-40">↑ Lên</button><button type="button" disabled={index === items.length - 1} onClick={() => setItems(list => { const next=[...list]; [next[index+1],next[index]]=[next[index],next[index-1]]; return next; })} className="rounded border bg-white px-3 py-1 disabled:opacity-40">↓ Xuống</button><button type="button" onClick={() => setItems(list => list.filter(entry => entry.id !== item.id))} className="rounded border border-red-200 bg-red-50 px-3 py-1 text-red-700">Xóa mục</button></div>
              </div>
            </details>
          ))}
        </div>
      )}
    </details></>}
    {workspace === 'page' && <><details className="rounded-xl border border-emerald-200 bg-emerald-50 p-3" open>
      <summary className="cursor-pointer font-bold text-emerald-950">Tùy chỉnh logo, thương hiệu và menu</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Tên thương hiệu<input value={menuConfig.brandName} onChange={e => setMenuConfig(v => ({...v, brandName: e.target.value}))} maxLength={40} disabled={!authorized} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm font-semibold">Khẩu hiệu<input value={menuConfig.slogan} onChange={e => setMenuConfig(v => ({...v, slogan: e.target.value}))} maxLength={80} disabled={!authorized} className="mt-1 w-full rounded-lg border p-2" /></label>
        <label className="text-sm font-semibold sm:col-span-2">Logo (emoji hoặc URL ảnh HTTPS)<input value={menuConfig.logo} onChange={e => setMenuConfig(v => ({...v, logo: e.target.value}))} maxLength={300} disabled={!authorized} className="mt-1 w-full rounded-lg border p-2" /></label>
        {MENU_ITEMS.map(([id, fallback]) => <div key={id} className="grid grid-cols-[64px_minmax(0,1fr)] gap-2">
          <label className="text-xs font-semibold">Biểu tượng<input value={menuConfig.icons[id] || ''} onChange={e => setMenuConfig(v => ({...v, icons: {...v.icons, [id]: e.target.value}}))} placeholder="✨" maxLength={8} disabled={!authorized} className="mt-1 w-full rounded-lg border p-2" /></label>
          <label className="text-xs font-semibold">Tên mục<input value={menuConfig.labels[id] || ''} onChange={e => setMenuConfig(v => ({...v, labels: {...v.labels, [id]: e.target.value}}))} placeholder={fallback} maxLength={50} disabled={!authorized} className="mt-1 w-full rounded-lg border p-2" /></label>
        </div>)}
        <button type="button" onClick={saveMenu} disabled={!authorized || saving} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Lưu menu lên Firebase</button>
      </div>
    </details>
    <details className="rounded-xl border border-slate-200 p-3">
      <summary className="cursor-pointer font-bold">Chi tiết dữ liệu trang đang chọn</summary>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><p><b>Mã trang:</b> {page}</p><p><b>Số tư liệu:</b> {items.length}/100</p><p><b>Đầu trang:</b> {items.filter(i => i.position === 'top').length}</p><p><b>Cuối trang:</b> {items.filter(i => i.position === 'bottom').length}</p><p><b>Banner:</b> {items.filter(i => i.display === 'banner').length}</p><p><b>Popup:</b> {items.filter(i => i.display === 'popup').length}</p></div>
      <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-200">{JSON.stringify(items, null, 2)}</pre>
    </details>
    <details className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
      <summary className="cursor-pointer font-bold text-indigo-950">Tạo trang và menu mới</summary>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <input value={newPage.menuLabel} onChange={e => setNewPage(v => ({...v, menuLabel: e.target.value}))} placeholder="Tên menu" className="rounded-lg border p-2" />
        <input value={newPage.slug} onChange={e => setNewPage(v => ({...v, slug: e.target.value}))} placeholder="slug-vi-du" className="rounded-lg border p-2" />
        <input value={newPage.title} onChange={e => setNewPage(v => ({...v, title: e.target.value}))} placeholder="Tiêu đề trang" className="rounded-lg border p-2" />
        <input value={newPage.icon} onChange={e => setNewPage(v => ({...v, icon: e.target.value}))} placeholder="📘" maxLength={8} className="rounded-lg border p-2" />
        <textarea value={newPage.description} onChange={e => setNewPage(v => ({...v, description: e.target.value}))} placeholder="Mô tả trang" rows={3} className="rounded-lg border p-2 sm:col-span-2" />
        <button type="button" onClick={createPage} disabled={!authorized} className="rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Tạo trang + menu</button>
      </div>
    </details></>}
  </section>;
};
